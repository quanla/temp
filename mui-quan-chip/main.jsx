import {createRoot} from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {QuanChip, QuanProvider} from "../src/index";

const Row = ({title, children}) => (
    <Stack spacing={1}>
        <Typography variant="overline">{title}</Typography>
        <Stack direction="row" spacing={1}>
            {children}
        </Stack>
    </Stack>
);

const Demo = () => (
    <Stack spacing={3} sx={{p: 4}}>
        <Typography variant="h4">QuanChip</Typography>

        <Row title="Default">
            <QuanChip/>
        </Row>

        <Row title="Props">
            <QuanChip label="Quan Le" color="success"/>
            <QuanChip variant="outlined"/>
        </Row>

        <Row title="Context set outside">
            <QuanProvider value={{label: "Hi Quan", color: "secondary"}}>
                <QuanChip/>
                <QuanChip color="error"/>
            </QuanProvider>
        </Row>

        <Row title="Inside a Tooltip (needs the forwarded ref)">
            <Tooltip title="Hello from Quan">
                <QuanChip/>
            </Tooltip>
        </Row>
    </Stack>
);

createRoot(document.getElementById("root")).render(
    <>
        <CssBaseline/>
        <Demo/>
    </>
);
